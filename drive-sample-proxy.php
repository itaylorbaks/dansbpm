<?php
declare(strict_types=1);

if (($_SERVER["REQUEST_METHOD"] ?? "") !== "GET") {
    http_response_code(405);
    header("Allow: GET");
    exit;
}

$id = $_GET["id"] ?? "";
if (!is_string($id) || !preg_match('/\A[A-Za-z0-9_-]{10,128}\z/', $id)) {
    http_response_code(400);
    exit;
}

$allowlistPath = __DIR__ . "/drive-sample-ids.json";
$allowlistJson = @file_get_contents($allowlistPath);
$allowlist = is_string($allowlistJson) ? json_decode($allowlistJson, true) : null;
if (!is_array($allowlist)) {
    error_log("Drive sample proxy could not read its ID allowlist.");
    http_response_code(500);
    exit;
}
if (!in_array($id, $allowlist, true)) {
    http_response_code(404);
    exit;
}
if (!function_exists("curl_init")) {
    error_log("Drive sample proxy requires the PHP cURL extension.");
    http_response_code(503);
    exit;
}

$url = "https://drive.usercontent.google.com/download?id=" . rawurlencode($id) . "&export=download&confirm=t";
$upstreamHeaders = [];
$sentHeaders = false;
$curl = curl_init($url);
curl_setopt_array($curl, [
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_MAXREDIRS => 4,
    CURLOPT_CONNECTTIMEOUT => 15,
    CURLOPT_TIMEOUT => 180,
    CURLOPT_PROTOCOLS => CURLPROTO_HTTPS,
    CURLOPT_REDIR_PROTOCOLS => CURLPROTO_HTTPS,
    CURLOPT_USERAGENT => "DansBPM sound catalog proxy",
    CURLOPT_HTTPHEADER => ["Accept: audio/*, application/octet-stream;q=0.9, */*;q=0.8"],
    CURLOPT_HEADERFUNCTION => static function ($handle, string $line) use (&$upstreamHeaders): int {
        if (preg_match('/^HTTP\/\S+\s+\d{3}\b/i', $line)) {
            $upstreamHeaders = [];
            return strlen($line);
        }
        $separator = strpos($line, ":");
        if ($separator !== false) {
            $name = strtolower(trim(substr($line, 0, $separator)));
            $upstreamHeaders[$name] = trim(substr($line, $separator + 1));
        }
        return strlen($line);
    },
    CURLOPT_WRITEFUNCTION => static function ($handle, string $chunk) use (&$upstreamHeaders, &$sentHeaders): int {
        $status = curl_getinfo($handle, CURLINFO_RESPONSE_CODE);
        if ($status < 200 || $status >= 300) {
            return 0;
        }
        if (!$sentHeaders) {
            $contentType = strtolower(trim((string) ($upstreamHeaders["content-type"] ?? "")));
            $mediaType = $contentType !== "" ? strtolower(trim(strtok($contentType, ";"))) : "";
            if (!str_starts_with($mediaType, "audio/") && $mediaType !== "application/octet-stream") {
                http_response_code(502);
                return 0;
            }
            http_response_code($status);
            header("Content-Type: " . $mediaType);
            header("Content-Disposition: inline");
            header("Cache-Control: no-store");
            header("X-Content-Type-Options: nosniff");
            $sentHeaders = true;
        }
        echo $chunk;
        if (ob_get_level() > 0) {
            ob_flush();
        }
        flush();
        return strlen($chunk);
    },
]);

$success = curl_exec($curl);
$status = curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
$error = curl_error($curl);
curl_close($curl);

if ($success === false || $status < 200 || $status >= 300 || !$sentHeaders) {
    error_log("Drive sample proxy failed for {$id}: HTTP {$status}; {$error}");
    if (!headers_sent()) {
        http_response_code(502);
        header("Cache-Control: no-store");
    }
}
