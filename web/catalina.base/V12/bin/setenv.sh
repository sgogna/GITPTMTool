CATALINA_PID="$CATALINA_BASE/tomcat.pid"
LOGGING_CONFIG="-Djava.util.logging.config.file=$CATALINA_BASE/conf/logging.properties" 
SERVER=`uname -n`

JAVA_HOME=`/project/plab/performance/newtools/config/getProperty.sh tools jdk.home.$SERVER`
CATALINA_OPTS=""