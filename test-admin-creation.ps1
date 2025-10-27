$headers = @{
    "Content-Type" = "application/json"
    "x-admin-bootstrap-key" = "super-secret-bootstrap-key-change-me"
}

$body = @{
    email = "admin@example.com"
    password = "StrongPass!123"
    displayName = "First Admin"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/admin/admins.create" -Method Post -Headers $headers -Body $body
    Write-Host "Success: $($response | ConvertTo-Json -Depth 3)"
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    Write-Host "Response: $($_.Exception.Response)"
}