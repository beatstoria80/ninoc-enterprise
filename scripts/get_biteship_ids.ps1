Add-Type -AssemblyName Microsoft.VisualBasic

$testKey = [Microsoft.VisualBasic.Interaction]::InputBox("PASTE TEST API KEY BITESHIP ANDA DI SINI (Berawalan biteship_test.):", "Aktivasi Biteship API", "")

if ([string]::IsNullOrWhiteSpace($testKey)) {
    [System.Windows.Forms.MessageBox]::Show("API Key kosong. Dibatalkan.", "Error")
    exit
}

if ($testKey -notmatch "^biteship_test\.") {
    [System.Windows.Forms.MessageBox]::Show("API Key harus berawalan 'biteship_test.'", "Error")
    exit
}

# 1. Buat Order Delivered
$headers = @{ "Authorization" = $testKey; "Content-Type" = "application/json" }
$body = @{ 
    shipper_contact_name = "NINOC"; shipper_contact_phone = "081234567890"; shipper_organization = "NINOC"; 
    origin_contact_name = "NINOC"; origin_contact_phone = "081234567890"; origin_address = "Jl. Merdeka No 1, Jakarta"; origin_postal_code = 10110; 
    destination_contact_name = "Test"; destination_contact_phone = "089876543210"; destination_address = "Jl. Sudirman, Jakarta"; destination_postal_code = 12190; 
    courier_company = "jnt"; courier_type = "ez"; delivery_type = "now"; 
    items = @(@{ id = "test-1"; name = "Test"; value = 100000; quantity = 1; weight = 500 }) 
} | ConvertTo-Json -Depth 5

$order1 = Invoke-RestMethod -Uri "https://api.biteship.com/v1/orders" -Method POST -Headers $headers -Body $body

# 2. Buat Order Cancelled
$body2 = @{ 
    shipper_contact_name = "NINOC2"; shipper_contact_phone = "081234567890"; shipper_organization = "NINOC"; 
    origin_contact_name = "NINOC"; origin_contact_phone = "081234567890"; origin_address = "Jl. Merdeka No 1, Jakarta"; origin_postal_code = 10110; 
    destination_contact_name = "Test2"; destination_contact_phone = "089876543210"; destination_address = "Jl. Sudirman, Jakarta"; destination_postal_code = 12190; 
    courier_company = "jnt"; courier_type = "ez"; delivery_type = "now"; 
    items = @(@{ id = "test-2"; name = "Test"; value = 100000; quantity = 1; weight = 500 }) 
} | ConvertTo-Json -Depth 5

$order2 = Invoke-RestMethod -Uri "https://api.biteship.com/v1/orders" -Method POST -Headers $headers -Body $body2
$cancelBody = @{ cancellation_reason = "Test" } | ConvertTo-Json
Invoke-RestMethod -Uri "https://api.biteship.com/v1/orders/$($order2.id)/cancel" -Method POST -Headers $headers -Body $cancelBody

$resultText = @"
==========================================
BERHASIL! COPY ID DI BAWAH INI KE FORMULIR
==========================================

ID Pesanan Terkirim (Delivered)  : $($order1.id)

ID Pesanan Dibatalkan (Cancelled): $($order2.id)

==========================================
"@

$resultPath = "$env:TEMP\biteship_result.txt"
Set-Content -Path $resultPath -Value $resultText

# Buka otomatis
Start-Process notepad.exe $resultPath
