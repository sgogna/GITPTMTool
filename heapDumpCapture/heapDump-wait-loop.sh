#!/bin/bash

TARGET=$1
TIER=$2
TAG=$3
DIR=$(dirname $0)

APP=`$DIR/../config/getProperty.sh $TARGET APP`
INSTANCE=`$DIR/../config/getProperty.sh $TARGET INSTANCE`
LIMIT=`$DIR/../config/getProperty.sh $TARGET heap.dump.capture.sizeLimit`
ITERATIONS_LIMIT=`$DIR/../config/getProperty.sh $TARGET heap.dump.capture.iterationLimit`
SLEEP_TIME=`$DIR/../config/getProperty.sh $TARGET heap.dump.capture.sleepTime`
TARGET_DIR=`$DIR/../config/getProperty.sh $TARGET heap.dump.capture.$TIER.targetDir`
EMAIL_REPORT_ADDRESS=`$DIR/../config/getProperty.sh $TARGET EMAIL_REPORT_ADDRESS`
echo $APP" / " $INSTANCE;

checkPidSize () {
PID=`$DIR/../scripts/getTomcatPID.sh $INSTANCE`
SIZE=`$DIR/calculateHeapSize.sh $PID | cut -d'.' -f1`
echo $PID" / "$SIZE;

if [ "$SIZE" -le $LIMIT ] ; then
 echo "heap smaller than $LIMIT";
else
 echo "heap bigger than $LIMIT"
fi

}

wait () {
checkPidSize;

ITERATION=1

while [ "$SIZE" -ge $LIMIT ] ; do
 if [ "$ITERATION" -gt $ITERATIONS_LIMIT ] ; then
  echo "can't wait anymore";
  break;
 fi
 sleep $SLEEP_TIME;
 checkPidSize;
 ITERATION=$((ITERATION + 1));
done;

echo "completed, iteration: $ITERATION, size: $SIZE";
}

capture () {
 echo "INSIDE CAPTURE METOD"
 date=`date "+%Y%m%d_%H%M%S"`
 $DIR/captureHeapDump.sh $PID "$TARGET_DIR/$TARGET-$TIER.$date.$TAG.hprof" $EMAIL_REPORT_ADDRESS
 $DIR/../scripts/appendTestProperty.sh "$TEST_ID" "$TARGET.$TIER.heapDump" "$TARGET_DIR/$TARGET-$TIER.$date.$TAG.hprof.gz"
}
echo "Calling wait"
wait;
capture;
host=`uname -n`
user=`whoami`
PIDFILE="pid/$host.$user.$TARGET.$TIER.pid"
rm $PIDFILE

