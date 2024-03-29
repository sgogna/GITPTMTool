#!/bin/bash

DIR=$(dirname $(readlink -f $0))

# PARAMS 
TARGET=$1
TAG=$2
FILTER_DATE_START=$3
FILTER_DATE_END=$4
SERVER=`uname -n`

getDate () {
  DATE=`echo $1 | tr " " "\n" | head -n 1`
  echo "$DATE";
}

getInputFile () {

	if [ ! -f $ELOG_PATTERN ]; then
           ELOG_PATTERN=$ELOG_PATTERN".gz"
	fi;
	echo $ELOG_PATTERN
}

# AIRLINE SPECIFIC SETTINGS
AVAILABLE_TARGETS=`$DIR/../config/getProperty.sh tools ptm.targets.$SERVER`

arr=$(echo $AVAILABLE_TARGETS | tr ";" "\n")

if [[ -n "$TARGET" && ${arr[*]} =~ $TARGET ]]
 then
  AIRLINE=`$DIR/../config/getProperty.sh $TARGET PRODUCT`;
  TIERS=`$DIR/../config/getProperty.sh $TARGET TIERS`;
 else
   echo "invalid target: "$TARGET;
   exit;
fi

JVM_ARGS="-Xms1510m -Xmx1512m -XX:+UseConcMarkSweepGC -Xloggc:gc.log -verbose:gc -XX:+PrintGCDateStamps -XX:+PrintGCDetails -XX:NewRatio=1 -XX:NewSize=700m"
JMX_ARGS=" -Dcom.sun.management.jmxremote.port=9099 -Dcom.sun.management.jmxremote.ssl=false -Dcom.sun.management.jmxremote.authenticate=false"
LIBS=`ls $DIR/lib/*.jar | xargs | tr " " ":"`
CP="-classpath "$LIBS":$DIR com.eb2.elogging.EloggingParser"

PTM_ENV=`$DIR/../config/getProperty.sh tools ptm.env.$SERVER`
echo "PTM_ENV ::: " $PTM_ENV;
if [ "$PTM_ENV" != "" ]
then
	DEST_DIR="$DIR/../artifacts/$PTM_ENV/eLoggingCharts/$AIRLINE"
else
	DEST_DIR="$DIR/../artifacts/eLoggingCharts/$AIRLINE"
fi
ELOG_JS_DIR="$DIR/web/$AIRLINE/js/eLogging"
DEST_DIR_ARG="-Dconfig.allTestsDirectory=$DEST_DIR -Dconfig.javascriptConfigDirectory=$ELOG_JS_DIR"

tier_arr=$(echo $TIERS | tr ";" "\n")

for tier in $tier_arr
  do
    echo "";
    APPS=`$DIR/../config/getProperty.sh $TARGET $tier.apps`
    apps_arr=$(echo $APPS | tr ";" "\n")
    for app in $apps_arr
    do 
    echo "AIRLINES IS ::::: " $AIRLINE;
    CONFIG="-Dconfig.xml.file=config/$AIRLINE-$tier-$app.xml -Dconfig.target.evn=$TARGET"

	ELOG_PATTERN=`"$DIR/../"scripts/getEloggingPattren.sh $TARGET elogging.pattern.$tier.$app`
    	echo "ELOG_PATTERN= $ELOG_PATTERN";

    	date_start=$(getDate $FILTER_DATE_START);
	start=$(getInputFile $ELOG_PATTERN $date_start);

	date_end=$(getDate $FILTER_DATE_END);
        end=$(getInputFile $ELOG_PATTERN $date_end);

	if [ ! "$date_start" == "$date_end" ]; then
		ELOG_PATTERN="$start;$end";
		else 
		ELOG_PATTERN="$start";
	fi
	echo "$ELOG_PATTERN";

	#FILES ARGS
	FILE="-DsrcFile="$ELOG_PATTERN
	
	#TEST NAME
	NAME_SHORT=$AIRLINE"_"$date_start"_"$TARGET"_"$tier"_"$app"_"$TAG
	NAME="-DsrcTestName="$NAME_SHORT

	#DATE FILTER
	START_DATE="-DstartDate=$FILTER_DATE_START"
	END_DATE="-DendDate=$FILTER_DATE_END"
	DATE_FILTER="$START_DATE $END_DATE"
	echo  $JVM_ARGS $CONFIG "$NAME" "$FILE" "$START_DATE" "$END_DATE" $DEST_DIR_ARG $CP
	JDK_HOME=`$DIR/../config/get-jdk-home.sh`
	"$JDK_HOME"bin/java $JVM_ARGS $CONFIG "$NAME" "$FILE" "$START_DATE" "$END_DATE" $DEST_DIR_ARG $CP
	chmod -R a+rwx $DEST_DIR"/"$NAME_SHORT
	if [ "$PTM_ENV" != "" ]
	then
		$DIR/../scripts/appendTestProperty.sh "$TEST_ID" "$TARGET.$tier.$app.eLoggingCharts" "artifacts/$PTM_ENV/eLoggingCharts/$AIRLINE/$NAME_SHORT"
	else
		$DIR/../scripts/appendTestProperty.sh "$TEST_ID" "$TARGET.$tier.$app.eLoggingCharts" "artifacts/eLoggingCharts/$AIRLINE/$NAME_SHORT"
	fi
	echo "";
  done
done
