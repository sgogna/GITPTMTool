#!/bin/bash
DIR=$(dirname $(readlink -f $0))
SERVER=`uname -n`

PTM_ENV=`$DIR/../config/getProperty.sh tools ptm.env.$SERVER`

latest=`ls -lftr "$DIR"/../artifacts/$PTM_ENV/shadowtail/$1/*.log | tail -n 1`
echo $latest;
