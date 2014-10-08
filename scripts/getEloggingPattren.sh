 #!/bin/bash
 DIR=$(dirname $(readlink -f $0))
 TARGET=$1
 ELOG_NAME=$2
 SERVER=`uname -n`

 PTM_ENV=`$DIR/../config/getProperty.sh tools ptm.env.$SERVER`

 if [ -f "$DIR"/getEloggingPattren.$PTM_ENV.sh ];
	 then
		source "$DIR"/getEloggingPattren.$PTM_ENV.sh $TARGET
	 else
		source "$DIR"/getEloggingPattren.default.sh $TARGET $ELOG_NAME
 fi