param([string]$IPAddress,[int]$Port=5443)
$ErrorActionPreference='Stop'
if(-not $IPAddress){
  $networkConfig=Get-NetIPConfiguration | Where-Object { $_.IPv4DefaultGateway -and $_.IPv4Address } | Select-Object -First 1
  $IPAddress=$networkConfig.IPv4Address.IPAddress
}
$address=$null
if(-not [System.Net.IPAddress]::TryParse($IPAddress,[ref]$address) -or $address.AddressFamily -ne 'InterNetwork'){throw 'Use a valid private IPv4 address.'}
$octets=$IPAddress.Split('.') | ForEach-Object {[int]$_}
if(-not ($octets[0] -eq 10 -or ($octets[0] -eq 192 -and $octets[1] -eq 168) -or ($octets[0] -eq 172 -and $octets[1] -ge 16 -and $octets[1] -le 31))){throw 'Use a private network address.'}
$opensslCommand=Get-Command openssl -ErrorAction SilentlyContinue
if($opensslCommand){$openssl=$opensslCommand.Source}else{$openssl=Join-Path $env:ProgramFiles 'Git\usr\bin\openssl.exe'}
if(-not (Test-Path -LiteralPath $openssl)){throw 'OpenSSL not found. Install Git for Windows, or configure your own TLS_KEY and TLS_CERT.'}
$certificateDirectory=Join-Path $env:LOCALAPPDATA 'remote-do-davisao\certs'
New-Item -ItemType Directory -Path $certificateDirectory -Force | Out-Null
$rootKey=Join-Path $certificateDirectory 'root-key.pem'
$rootPem=Join-Path $certificateDirectory 'root-cert.pem'
$rootDer=Join-Path $certificateDirectory 'root-cert.cer'
$serverKey=Join-Path $certificateDirectory 'server-key.pem'
$serverCert=Join-Path $certificateDirectory 'server-cert.pem'
$serverRequest=Join-Path $certificateDirectory 'server.csr'
$extensions=Join-Path $certificateDirectory 'server.ext'
if((Test-Path $rootKey) -ne (Test-Path $rootPem)){throw 'Incomplete local CA. Check the certificate folder before continuing.'}
if(-not (Test-Path $rootKey)){
  & $openssl req -x509 -newkey rsa:2048 -nodes -keyout $rootKey -out $rootPem -days 3650 -subj '/CN=remote do davisao Local CA' -addext 'basicConstraints=critical,CA:TRUE' -addext 'keyUsage=critical,keyCertSign,cRLSign'
  if($LASTEXITCODE -ne 0){throw 'Could not generate local CA.'}
}
@"
basicConstraints=critical,CA:FALSE
keyUsage=critical,digitalSignature,keyEncipherment
extendedKeyUsage=serverAuth
subjectAltName=IP:$IPAddress,DNS:localhost
"@ | Set-Content -LiteralPath $extensions -Encoding ascii
& $openssl req -new -newkey rsa:2048 -nodes -keyout $serverKey -out $serverRequest -subj '/CN=remote do davisao'
if($LASTEXITCODE -ne 0){throw 'Could not generate server key.'}
& $openssl x509 -req -in $serverRequest -CA $rootPem -CAkey $rootKey -CAcreateserial -out $serverCert -days 365 -sha256 -extfile $extensions
if($LASTEXITCODE -ne 0){throw 'Could not sign server certificate.'}
& $openssl x509 -in $rootPem -outform DER -out $rootDer
if($LASTEXITCODE -ne 0){throw 'Could not export public CA certificate.'}
$env:TLS_KEY=$serverKey
$env:TLS_CERT=$serverCert
$env:LOCAL_CA_CERT=$rootDer
$env:APP_ORIGIN='https://davvi0.github.io'
$env:PORT=[string]$Port
Write-Output "HTTPS server: https://${IPAddress}:$Port"
Write-Output "Public CA certificate: http://${IPAddress}:5173/setup/local-ca.cer"
Write-Output 'Install only the public CA on your iPhone, then enable certificate trust in Settings. Never share root-key.pem.'
Set-Location -LiteralPath (Split-Path $PSScriptRoot -Parent)
node server/index.js
