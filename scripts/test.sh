 #!/bin/bash
 SERVER=`uname -n`

 PTM_ENV=`$DIR/../config/getProperty.sh tools ptm.env.$SERVER`
 
 if [ -f getEloggingPattren.$PTM_ENV.sh ];
	 then
		source getEloggingPattren.$PTM_ENV.sh $TARGET
	 else
		source getEloggingPattren.default.sh $TARGET $ELOG_NAME
 fi