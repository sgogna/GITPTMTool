PID=$1
DIR=$(dirname $(readlink -f $0))
JDK_HOME=`$DIR/../config/get-jdk-home.sh`

$JDK_HOME/bin/jinfo -flags $PID | tr " " "\n" | grep -v proxy | grpe -v Attaching | grep -v Debugger
$JDK_HOME/bin/jinfo -sysprops $PID | grep -v proxy
