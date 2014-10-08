DIR=$(dirname $(readlink -f $0))

ROOT="$DIR/../../../"
JDK_HOME=`$ROOT/config/get-jdk-home.sh`
CLASSPATH="$ROOT/shadowtail/lib/*:$ROOT/csvcollector/lib/*:$ROOT/csvcollector"
"$JDK_HOME"bin/java -classpath $CLASSPATH -Dconfig.tag=$TAG -Dlog4j.configuration="./log4j.properties" com.csvcollector.shadowtail.GroupShadowtailReports $1
