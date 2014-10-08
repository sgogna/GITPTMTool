DIR=$(dirname $(readlink -f $0))
export JAVA_OPTS=-DPTM_ENV=${PTM_ENV}

SERVER=$1

if [ -z "$SERVER" ]; then
 SERVER=`uname -n`
fi

TOMCAT_HOME=`../config/getProperty.sh tools tomcat.home.$SERVER`
CATALINA_HOME=`../config/getProperty.sh tools ptm.env.$SERVER`
export JAVA_OPTS=-DPTM_ENV=$CATALINA_HOME

export CATALINA_BASE=$(dirname $0)/catalina.base/"$CATALINA_HOME"/
echo $CATALINA_BASE
echo $TOMCAT_HOME
"$TOMCAT_HOME"/bin/catalina.sh start