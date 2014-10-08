CATALINA_PID="$CATALINA_BASE/tomcat.pid"
DIR=$(dirname $0)
SERVER=`uname -n`

LOGGING_CONFIG="-Djava.util.logging.config.file=$CATALINA_BASE/conf/logging.properties" 
JAVA_HOME=`$DIR/../../config/getProperty.sh tools jdk.home.$SERVER`
CATALINA_OPTS=""