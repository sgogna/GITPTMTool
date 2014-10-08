./rmdirsForJs.sh
./mkdirsForJs.sh

AIRLINE=B6

#FILES
T1_LOG_PATTERN="/ssw2/logs/cert/B6/sswhlc251/inst1/eLoggingWeb."
T2_LOG_PATTERN="/ssw2/logs/cert/B6/sswhlc271/inst1/eLoggingServer."
T1_FILE="-DsrcFile="$T1_LOG_PATTERN$1".log.gz"
T2_FILE="-DsrcFile="$T2_LOG_PATTERN$1".log.gz"

#TEST NAME
T1_NAME="-DsrcTestName="$1_$2_"T1"
T2_NAME="-DsrcTestName="$1_$2_"T2"

#CONFIG
T1_CONFIG="-Dconfig.file=config/B6-T1.properties"
T2_CONFIG="-Dconfig.file=config/B6-T2.properties"

#DATE FILTER
START_DATE="-DstartDate=$3"
END_DATE="-DendDate=$4"
DATE_FILTER=$START_DATE" "$END_DATE

JVM_ARGS="-Xms300m -Xmx512m -XX:NewRatio=1 -XX:NewSize=250m -XX:+UseConcMarkSweepGC"
JMX_ARGS=" -Dcom.sun.management.jmxremote.port=9010 -Dcom.sun.management.jmxremote.ssl=false -Dcom.sun.management.jmxremote.authenticate=false"
CP="-cp eLoggingParser-1.2.jar com.eb2.elogging.ChartsGenerator"

T1_ARGS=$T1_CONFIG" "$T1_NAME" "$T1_FILE" "$DATE_FILTER
T2_ARGS=$T2_CONFIG" "$T2_NAME" "$T2_FILE" "$DATE_FILTER

java $JVM_ARGS $JMX_ARGS $T1_CONFIG $T1_NAME $T1_FILE "$DATE_FILTER" $CP
java $JVM_ARGS $JMX_ARGS $T2_CONFIG $T2_NAME $T2_FILE "$DATE_FILTER" $CP

OUT_ARCH=results-$AIRLINE-new/$AIRLINE_$1_$2.tgz

tar -czf $OUT_ARCH js/eLogging/tests
Xecho | Xmutt -a $OUT_ARCH -s "$OUT_ARCH" -- "sebastian.puzon@sabre.com;Bejoy.Nellissery.ctr@sabre.com;nikodem.jura@sabre.com"
./rmdirsForJs.sh

