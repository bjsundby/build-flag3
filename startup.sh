#!/bin/bash
# Startup script for build-flag
#
# Edit crontab file by running crontab -e
# Add the following line refering to this file's position
#  @reboot /usr/bin/sudo -u pi -H sh /home/pi/build-flag3/startup.sh
#

cd /home/pi/build-flag3
sudo npm start >> build-flag3.log 2>> build-flag3_err.log
