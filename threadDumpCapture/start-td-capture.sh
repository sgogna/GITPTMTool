#!/bin/bash

TARGET=$1
TIER=$2
TAG=$3
INTERVAL=$4

APP="$TARGET-$TIER"

echo "executing start-td-capture $TARGET $TIER $TAG $INTERVAL";

host=`uname -n`
user=`whoami`
file="pid/$host.$user.$APP.pid"

if [ -f $file ] ; then
 echo "checking file: $file";
 PID=`cat $file`;
 search=`ps $PID | tail -n 1 | xargs`;
 PID2=`echo $search | cut -d' ' -f1`;

 if [ "$PID" = "$PID2" ]; then
	echo "The process is already running: $search";
	exit 0;
 else
   echo "The process is not running: "$PID;
   rm $file;
 fi

fi

./capture-loop.sh $TARGET $TIER $TAG $INTERVAL &
PID=$!
echo $PID > "pid/$host.$user.$APP.pid"
echo "started thread dump loop capture: $PID";

