TARGET=$1
TIER=$2

DIR=$(dirname $(readlink -f $0))
JDK_HOME=`$DIR/../config/get-jdk-home.sh`
INSTANCE=`$DIR/../config/getProperty.sh $TARGET $TIER.instance`

$JDK_HOME/bin/jps -lmv | grep inst$INSTANCE | head -n +1 | cut -d' ' -f 1
