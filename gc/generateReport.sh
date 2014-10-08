DIR=$(dirname $(readlink -f $0))
JDK_HOME=`$DIR/../config/get-jdk-home.sh`
echo $JDK_HOME
$JDK_HOME/bin/java -jar /project/plab/performance/newtools/gcviewer/gcviewer-1.34-SNAPSHOT.jar $1 "$1.report.txt"
#cat "$1.report.txt"
$DIR/../csvcollector/scripts/gcLog/appendGCLogReport.sh "$1.report.txt"
