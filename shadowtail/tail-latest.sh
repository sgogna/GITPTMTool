#!/bin/bash
DIR=$(dirname $(readlink -f $0))
latest=`$DIR/latest-log.sh $1`
echo "latest file: $latest"
tail -f "$latest"
