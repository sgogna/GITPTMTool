# scripts/regenerateValidation.sh "web/B6/js/eLogging/tests/*t2_server/statistics.csv" "config/validation/B6-t2-server.xml"
# scripts/regenerateRatios.sh "web/V12/js/eLogging/tests/*T1/statistics.csv" "config/V12-t1-web-ratios.xml"
# scripts/regenerateRatios.sh "web/V12/js/eLogging/tests/*t1-web/statistics.csv" "config/V12-t1-web-ratios.xml"
# scripts/regenerateRatios.sh "web/B6/js/eLogging/tests/*t1_myb/statistics.csv" "config/B6-t1-myb-ratios.xml"

STATISTICS_FILTER=$1
CONFIG=$2

DIR=$(dirname $(readlink -f $0))
JDK_HOME=`$DIR/../../config/get-jdk-home.sh`
LIBS=`ls $DIR/../lib/*.jar | xargs | tr " " ":"`
"$JDK_HOME"bin/java

for file in $STATISTICS_FILTER ; do
        echo $file
        OUTPUT_FILE=$(dirname $file)"/validation.csv";
        "$JDK_HOME"bin/java -DinputFile="$file" -DoutputFile="$OUTPUT_FILE" -DconfigFile="$CONFIG" -cp $LIBS com.eb2.elogging.write.statistics.validation.MatchingAggregationEventValidator
done
