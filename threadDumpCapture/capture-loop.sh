#!/bin/bash

TARGET=$1
TIER=$2
TAG=$3
INTERVAL=$4
DIR=$(dirname $(readlink -f $0))

SERVER=`uname -n`

APP="$TARGET-$TIER"

JDK_HOME=`$DIR/../config/getProperty.sh tools jdk.home.$SERVER`
AVAILABLE_TARGETS=`$DIR/../config/getProperty.sh tools ptm.targets.$SERVER`

 PREV_TARGET=$TARGET;
 TARGET=`echo $AVAILABLE_TARGETS | tr ";" "\n" | grep -x $TARGET`;
 if [ "$TARGET" == "" ];
 then
     	 echo "invalid target: "$PREV_TARGET;
	 exit;
 else
   PRODUCT=`$DIR/../config/getProperty.sh $TARGET CARRIER`;
   INSTANCE=`$DIR/../config/getProperty.sh $TARGET INSTANCE`
fi

capture () {
 TARGETPID=`$JDK_HOME/bin/jps -lmv | grep inst$INSTANCE | head -n +1 | cut -d' ' -f 1`;
 echo "PRODUCT=$PRODUCT , INSTANCE=$INSTANCE , TARGETPID=$TARGETPID" >> logs.log;
 echo "capture-loop $TARGETPID $APP $TAG" >> logs.log;
 ./capture.sh $TARGETPID $APP $TAG >> logs.log;
}

capture;

while true ; do
 echo "sleeping $APP $INTERVAL" >> logs.log
 sleep $INTERVAL;
 capture;
done
