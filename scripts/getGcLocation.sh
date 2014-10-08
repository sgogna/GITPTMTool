 #!/bin/bash
 DIR=$(dirname $(readlink -f $0))
 TARGET=$1
 GC_NAME=$2
 SERVER=`uname -n`

 PTM_ENV=`$DIR/../config/getProperty.sh tools ptm.env.$SERVER`
 if [ -f "$DIR"/getGcLocation.$PTM_ENV.sh ];
	 then
		source "$DIR"/getGcLocation.$PTM_ENV.sh $TARGET
	 else
		source "$DIR"/getGcLocation.default.sh $TARGET $GC_NAME
 fi