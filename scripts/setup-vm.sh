#!/usr/bin/env bash
# One-time setup script for the Ubuntu VM that will host the app.
# Run this ONCE on your VMware Ubuntu machine: bash setup-vm.sh

set -e

echo "==> Updating system"
sudo apt-get update && sudo apt-get upgrade -y

echo "==> Installing Docker"
if ! command -v docker &> /dev/null; then
  curl -fsSL https://get.docker.com -o get-docker.sh
  sudo sh get-docker.sh
  sudo usermod -aG docker "$USER"
  rm get-docker.sh
  echo "Docker installed. You may need to log out/in for group changes to apply."
else
  echo "Docker already installed, skipping."
fi

echo "==> Installing Docker Compose plugin"
sudo apt-get install -y docker-compose-plugin

echo "==> Configuring firewall (ufw) — security requirement"
sudo apt-get install -y ufw
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp      # nginx (the app)
sudo ufw allow 3001/tcp    # Uptime Kuma dashboard
sudo ufw --force enable
sudo ufw status verbose

echo ""
echo "==================================================================="
echo " Docker + firewall setup complete."
echo ""
echo " NEXT STEP — install the GitHub Actions self-hosted runner:"
echo " 1. Go to your GitHub repo -> Settings -> Actions -> Runners -> New self-hosted runner"
echo " 2. Choose Linux x64 and follow the exact commands GitHub shows you, e.g.:"
echo ""
echo "    mkdir actions-runner && cd actions-runner"
echo "    curl -o actions-runner-linux-x64.tar.gz -L <URL_FROM_GITHUB>"
echo "    tar xzf ./actions-runner-linux-x64.tar.gz"
echo "    ./config.sh --url https://github.com/<you>/<repo> --token <TOKEN_FROM_GITHUB>"
echo "    sudo ./svc.sh install"
echo "    sudo ./svc.sh start"
echo ""
echo " After that, clone your repo into this VM (e.g. ~/todo-app) so the runner"
echo " has a working directory with docker-compose.yml, then push to 'main' —"
echo " the pipeline will build, test, and deploy automatically."
echo "==================================================================="
