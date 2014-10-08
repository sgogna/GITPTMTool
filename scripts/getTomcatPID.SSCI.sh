#!/bin/bash
DIR=$(dirname $0)
TARGET=$1
APP=`$DIR/../config/getProperty.sh $TARGET APP`
CARRIER=`$DIR/../config/getProperty.sh $TARGET CARRIER`
SERVER=`uname -n`

PTM_ENV=`$DIR/../config/getProperty.sh tools ptm.env.$SERVER`

if [ "$PTM_ENV" != "" ]
then
	JDK_HOME=`$DIR/../config/getProperty.sh tools.$PTM_ENV JDK_HOME`
else
	JDK_HOME=`$DIR/../config/getProperty.sh tools JDK_HOME`
fi
TARGET_PID=`"$JDK_HOME"/bin/jps -mlv | grep "carrier=$CARRIER" | grep "app=$APP" | head -n +1 | cut -d' ' -f 1`
echo $TARGET_PID 