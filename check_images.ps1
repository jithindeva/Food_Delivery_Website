$content = Get-Content 'src\data.js' -Raw
$pattern = '/images/[a-zA-Z0-9_.\\-]+'
$allMatches = [regex]::Matches($content, $pattern)
$refs = ($allMatches | ForEach-Object { $_.Value.Replace('/images/', '') }) | Sort-Object -Unique

$missing = @()
foreach ($ref in $refs) {
    $path = "public\images\$ref"
    if (-not (Test-Path $path)) {
        $missing += $ref
    }
}

Write-Host "=== MISSING IMAGES ==="
foreach ($m in $missing) { Write-Host $m }
Write-Host ""
Write-Host "Total referenced: $($refs.Count)"
Write-Host "Missing: $($missing.Count)"
