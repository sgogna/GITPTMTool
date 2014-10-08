# scripts/regenerateRatios.sh "web/B6/js/eLogging/tests/*t1_web/statistics.csv" "config/B6-t1-web-ratios.xml"
# scripts/regenerateRatios.sh "web/V12/js/eLogging/tests/*T1/statistics.csv" "config/V12-t1-web-ratios.xml"
# scripts/regenerateRatios.sh "web/V12/js/eLogging/tests/*t1-web/statistics.csv" "config/V12-t1-web-ratios.xml"
# scripts/regenerateRatios.sh "web/B6/js/eLogging/tests/*t1_myb/statistics.csv" "config/B6-t1-myb-ratios.xml"

STATISTICS_FILTER=$1
RATIO_CONFIG=$2

DIR=$(dirname $(readlink -f $0))
JDK_HOME=`$DIR/../../config/get-jdk-home.sh`
LIBS=`ls $DIR/../lib/*.jar | xargs | tr " " ":"`
"$JDK_HOME"bin/java

for file in $STATISTICS_FILTER ; do 
	echo $file
	OUTPUT_FILE=$(dirname $file)"/ratios.csv";
	"$JDK_HOME"bin/java -DinputFile="$file" -DoutputFile="$OUTPUT_FILE" -DconfigFile="$RATIO_CONFIG" -cp $LIBS com.eb2.elogging.write.statistics.StatisticsRatioCalculator
done
