#!/bin/bash

DIR=$(dirname $(readlink -f $0))

# PARAMS 
TARGET=$1
TAG=$2
FILTER_DATE_START=$3
FILTER_DATE_END=$4

getDate () {
  DATE=`echo $1 | tr " " "\n" | head -n 1`
  echo "$DATE";
}

getInputFile () {
       	DATE=$2
	ELOG_PATTERN="$1$DATE.log"
	if [ ! -f $ELOG_PATTERN ]; then
           ELOG_PATTERN=$ELOG_PATTERN".gz"
	fi;
	echo $ELOG_PATTERN
}

# AIRLINE SPECIFIC SETTINGS
AVAILABLE_TARGETS=`$DIR/../config/getProperty.sh tools TARGETS`
arr=$(echo $AVAILABLE_TARGETS | tr ";" "\n")

if [[ -n "$TARGET" && ${arr[*]} =~ $TARGET ]]
 then
  AIRLINE=`$DIR/../config/getProperty.sh $TARGET PRODUCT`;
  TIERS=`$DIR/../config/getProperty.sh $TARGET TIERS`;
 else
   echo "invalid target: "$TARGET;
   exit;
fi

JVM_ARGS="-Xms1000m -Xmx1512m -XX:+UseConcMarkSweepGC -Xloggc:gc.log -verbose:gc -XX:+PrintGCDateStamps -XX:+PrintGCDetails"
JMX_ARGS=" -Dcom.sun.management.jmxremote.port=9099 -Dcom.sun.management.jmxremote.ssl=false -Dcom.sun.management.jmxremote.authenticate=false"
LIBS=`ls $DIR/lib_new/*.jar | xargs | tr " " ":"`
CP="-classpath "$LIBS":$DIR com.eb2.elogging.EloggingParser"

DEST_DIR="$DIR/web/$AIRLINE/js/eLogging/tests"
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
    	CONFIG="-Dconfig.xml.file=config/$AIRLINE-$tier-$app.xml"
	ELOG_PATTERN=`$DIR/../config/getProperty.sh $TARGET elogging.pattern.$tier.$app`;
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
	NAME="-DsrcTestName="$AIRLINE"_"$date_start"_"$TAG"_"$tier"_"$app

	#DATE FILTER
	START_DATE="-DstartDate=$FILTER_DATE_START"
	END_DATE="-DendDate=$FILTER_DATE_END"
	DATE_FILTER="$START_DATE $END_DATE"

	echo "Date filter: $DATE_FILTER"
	echo  $JVM_ARGS $CONFIG "$NAME" "$FILE" "$START_DATE" "$END_DATE" $DEST_DIR_ARG $CP
	JDK_HOME=`$DIR/../config/get-jdk-home.sh`
	"$JDK_HOME"bin/java $JVM_ARGS $CONFIG $RATIOS $VALIDATION "$NAME" "$FILE" "$START_DATE" "$END_DATE" $DEST_DIR_ARG $CP
	chmod -R a+rwx $DEST_DIR"/"$AIRLINE"_"$DATE"_"$TAG"_"$tier"_"$app
	echo "";
  done
done
