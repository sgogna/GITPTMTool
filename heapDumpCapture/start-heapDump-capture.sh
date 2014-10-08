#!/bin/bash

TARGET=$1
TIER=$2d
TAG=$3
date=`date "+%Y%m%d_%H%M%S"`
host=`uname -n`
user=`whoami`
DIR=$(dirname $(readlink -f $0))
LOGFILE="logs/$host.$user.$TARGET.$TIER.$TAG.$date.log"

echo "executing start-heapDump-capture $TARGET $TIER $TAG"

file="pid/$host.$user.$TARGET.$TIER.pid"

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

echo "logging to $LOGFILE"
echo "TARGET ::: " $TARGET
$DIR/heapDump-wait-loop.sh $TARGET $TIER $TAG >> $LOGFILE 2>&1 &
PID=$!
echo $PID > "pid/$host.$user.$TARGET.$TIER.pid"
echo "started heap dump loop capture: $PID";
