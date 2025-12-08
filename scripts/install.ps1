<#
.SYNOPSIS
    Install DocFlow into any project
.DESCRIPTION
    Copies DocFlow workflows, templates, and config to target project
.PARAMETER TargetPath
    Path to the project where DocFlow should be installed
.PARAMETER ProjectName
    Name of the project (used in config)
.PARAMETER SkipWorkflows
    Skip copying GitHub workflows
.PARAMETER SkipTemplates
    Skip copying documentation templates
.EXAMPLE
    .\install.ps1 -TargetPath "C:\MyProject" -ProjectName "My Project"
#>

param(
    [Parameter(Mandatory = $true)]
    [string]$TargetPath,

    [Parameter(Mandatory = $true)]
    [string]$ProjectName,

    [string]$ProjectDescription = "",

    [switch]$SkipWorkflows,
    [switch]$SkipTemplates,
    [switch]$Force
)

$ErrorActionPreference = "Stop"
$DocFlowRoot = Split-Path -Parent $PSScriptRoot

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                    DocFlow Installer                          ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Validate target path
if (-not (Test-Path $TargetPath)) {
    Write-Host "Creating target directory: $TargetPath" -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $TargetPath -Force | Out-Null
}

$TargetPath = Resolve-Path $TargetPath

Write-Host "Target: $TargetPath" -ForegroundColor Green
Write-Host "Project: $ProjectName" -ForegroundColor Green
Write-Host ""

# Function to copy with confirmation
function Copy-DocFlowItem {
    param($Source, $Destination, $Description)

    $destDir = Split-Path -Parent $Destination
    if (-not (Test-Path $destDir)) {
        New-Item -ItemType Directory -Path $destDir -Force | Out-Null
    }

    if ((Test-Path $Destination) -and -not $Force) {
        Write-Host "  SKIP: $Description (exists)" -ForegroundColor Yellow
        return $false
    }

    Copy-Item -Path $Source -Destination $Destination -Force
    Write-Host "  ADD:  $Description" -ForegroundColor Green
    return $true
}

# 1. Copy GitHub Workflows
if (-not $SkipWorkflows) {
    Write-Host "Installing GitHub Workflows..." -ForegroundColor Cyan

    $workflowsSource = Join-Path $DocFlowRoot ".github\workflows"
    $workflowsDest = Join-Path $TargetPath ".github\workflows"

    $workflows = @(
        "docflow-quality-gates.yml",
        "docflow-security-scan.yml",
        "docflow-generate-docs.yml",
        "docflow-release.yml"
    )

    foreach ($wf in $workflows) {
        $src = Join-Path $workflowsSource $wf
        $dst = Join-Path $workflowsDest $wf
        if (Test-Path $src) {
            Copy-DocFlowItem -Source $src -Destination $dst -Description $wf
        }
    }
    Write-Host ""
}

# 2. Copy Documentation Templates
if (-not $SkipTemplates) {
    Write-Host "Installing Documentation Templates..." -ForegroundColor Cyan

    $templatesSource = Join-Path $DocFlowRoot "docs\templates"
    $templatesDest = Join-Path $TargetPath "docs\templates"

    if (Test-Path $templatesSource) {
        Copy-Item -Path $templatesSource -Destination $templatesDest -Recurse -Force
        Write-Host "  ADD:  docs/templates/*" -ForegroundColor Green
    }
    Write-Host ""
}

# 3. Create docflow.config.json
Write-Host "Creating Configuration..." -ForegroundColor Cyan

$configPath = Join-Path $TargetPath "docflow.config.json"
$configExists = Test-Path $configPath

if (-not $configExists -or $Force) {
    $config = @{
        '$schema' = "./docflow.schema.json"
        version = "1.0.0"
        project = @{
            name = $ProjectName
            description = $ProjectDescription
            type = "auto"
            language = "Australian English"
        }
        templates = @{
            scaffold = @{ enabled = $true }
            adr = @{ enabled = $true; directory = "docs/architecture/adr" }
            runbooks = @{ enabled = $true; directory = "docs/runbooks" }
        }
        security = @{
            owaspZap = @{ enabled = $false }
            secretScanning = @{ enabled = $true }
            codeql = @{ enabled = $true }
        }
        linting = @{
            enabled = $true
            failOnError = $true
        }
        releases = @{
            enabled = $true
            versioning = @{ strategy = "semver" }
        }
    }

    $config | ConvertTo-Json -Depth 10 | Set-Content -Path $configPath
    Write-Host "  ADD:  docflow.config.json" -ForegroundColor Green
} else {
    Write-Host "  SKIP: docflow.config.json (exists)" -ForegroundColor Yellow
}

# 4. Copy schema
$schemaSource = Join-Path $DocFlowRoot "docflow.schema.json"
$schemaDest = Join-Path $TargetPath "docflow.schema.json"
if (Test-Path $schemaSource) {
    Copy-DocFlowItem -Source $schemaSource -Destination $schemaDest -Description "docflow.schema.json"
}

# 5. Create basic docs structure
Write-Host ""
Write-Host "Creating Documentation Structure..." -ForegroundColor Cyan

$docFolders = @(
    "docs",
    "docs/architecture",
    "docs/architecture/adr",
    "docs/api",
    "docs/runbooks"
)

foreach ($folder in $docFolders) {
    $folderPath = Join-Path $TargetPath $folder
    if (-not (Test-Path $folderPath)) {
        New-Item -ItemType Directory -Path $folderPath -Force | Out-Null
        Write-Host "  ADD:  $folder/" -ForegroundColor Green
    }
}

# 6. Create .github folder structure
$githubFolders = @(
    ".github",
    ".github/workflows",
    ".github/ISSUE_TEMPLATE"
)

foreach ($folder in $githubFolders) {
    $folderPath = Join-Path $TargetPath $folder
    if (-not (Test-Path $folderPath)) {
        New-Item -ItemType Directory -Path $folderPath -Force | Out-Null
    }
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  DocFlow installed successfully!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Review docflow.config.json" -ForegroundColor White
Write-Host "  2. Commit and push to GitHub" -ForegroundColor White
Write-Host "  3. Workflows will run automatically" -ForegroundColor White
Write-Host ""
