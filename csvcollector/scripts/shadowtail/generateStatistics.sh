file=$1
output=$file".report.csv"
DIR=$(dirname $(readlink -f $0))
ROOT="$DIR/../../../"
JDK_HOME=`$ROOT/config/get-jdk-home.sh`

"$JDK_HOME"bin/java -classpath $ROOT/shadowtail/lib/*:$ROOT/csvcollector/lib/*:$ROOT/csvcollector com.csvcollector.shadowtail.ShadowtailLogAggregator $file > $output
echo "statistics generated to $output";
