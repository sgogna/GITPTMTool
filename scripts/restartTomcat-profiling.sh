DIR=$(dirname $(readlink -f $0))
TARGET=$1
TIER=$2
TAG=$3

validTarget=`$DIR/checkTarget.sh $TARGET`

if [ "$validTarget" == "true" ];
then
	agent=`$DIR/../profiling/yourkit/generateTomcatStartupParams.sh "$TARGET-$TIER"`
	echo "profilier params: $agent";
	export CATALINA_OPTS="$agent";
        $DIR/restartTomcat.sh $TARGET $TIER $TAG
else
	echo "invalid target";
fi;
 
