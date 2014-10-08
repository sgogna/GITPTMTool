DIR=$(dirname $(readlink -f $0))
TARGET=$1
TIER=$2
TAG=$3

validTarget=`$DIR/checkTarget.sh $TARGET`

DATE=`echo $1 | tr " " "\n" | head -n 1`
logFile="$DIR/logs/tomcat.restart.$DATE.$TARGET-$TIER.$TAG.log"

if [ "$validTarget" == "true" ];
then
	tomcatCMD=`$DIR/../config/getProperty.sh $TARGET "tomcat.cmd.$TIER"`

	$tomcatCMD stop-clean;
	$tomcatCMD start-clean;
else
    	echo "invalid target";
fi;
