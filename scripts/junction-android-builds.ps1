# Redirects every Android Gradle module's build output to F: while keeping the
# path string under C:\ (via NTFS junction), so C: never fills up but no code
# ever has to relativize() a path across a C:\ <-> F:\ drive boundary — the
# literal-F:-path approach breaks React Native's codegen tasks with
# "this and base files have different roots".
$ErrorActionPreference = "Stop"

$projectRoot = "C:\mobileapps\kemchutaapp"
$targetRoot = "F:\kemchuta-build\node_modules"

function Set-BuildJunction($androidDir, $targetName) {
    $buildPath = Join-Path $androidDir "build"
    $target = Join-Path $targetRoot $targetName

    if (Test-Path $buildPath) {
        $item = Get-Item $buildPath -Force
        if ($item.LinkType -eq "Junction") {
            Write-Output "skip (already junction): $buildPath"
            return
        }
        Remove-Item -Recurse -Force $buildPath
    }

    New-Item -ItemType Directory -Force -Path $target | Out-Null
    New-Item -ItemType Junction -Path $buildPath -Target $target | Out-Null
    Write-Output "junctioned: $buildPath -> $target"
}

# Root project and :app module
Set-BuildJunction "$projectRoot\android" "_root"
Set-BuildJunction "$projectRoot\android\app" "_app"

# Every native module under node_modules with an android/build.gradle
Get-ChildItem -Path "$projectRoot\node_modules" -Recurse -Force -Filter "build.gradle" -ErrorAction SilentlyContinue |
    Where-Object { $_.Directory.Name -eq "android" } |
    ForEach-Object {
        $androidDir = $_.Directory.FullName
        $rel = $androidDir.Substring("$projectRoot\node_modules\".Length)
        $safeName = ($rel -replace '[\\/@]', '_')
        Set-BuildJunction $androidDir $safeName
    }

Write-Output "done"
