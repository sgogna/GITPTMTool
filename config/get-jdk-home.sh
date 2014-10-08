DIR=$(dirname $(readlink -f $0))
SERVER=$1

if [ -z "$SERVER" ]; then
 SERVER=`uname -n`
fi

JDK_HOME=`$DIR/getProperty.sh tools jdk.home.$SERVER`

if [ -z "$JDK_HOME" ]; then
	JDK_HOME=`$DIR/getProperty.sh tools jdk.home.default`	
fi

echo $JDK_HOME