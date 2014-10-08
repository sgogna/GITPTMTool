TARGET=$1
DIR=$(dirname $(readlink -f $0))
SERVER=`uname -n`
PTM_ENV=`$DIR/../config/getProperty.sh tools ptm.env.$SERVER`

if [ "$PTM_ENV" != "" ]
then
	AVAILABLE_TARGETS=`$DIR/../config/getProperty.sh tools.$PTM_ENV TARGETS`
else
	AVAILABLE_TARGETS=`$DIR/../config/getProperty.sh tools TARGETS`
fi
arr=$(echo $AVAILABLE_TARGETS | tr ";" "\n")

TARGET=`echo $AVAILABLE_TARGETS | tr ";" "\n" | grep -x $TARGET`;
 if [ "$TARGET" == "" ];
 then
         echo "false";
 else
	echo "true";
fi
