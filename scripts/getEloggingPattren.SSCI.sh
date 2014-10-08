 #!/bin/bash
 TARGET=$1
 DIR=$(dirname $(readlink -f $0))
 SERVER=`uname -n`

 PTM_ENV=`$DIR/../config/getProperty.sh tools ptm.env.$SERVER`

 ELOG_PATTERN=`"$DIR"/getTomcatArgument.$PTM_ENV.sh $TARGET catalina.base | tr "=" "\n" | tail -n 1`
 ELOG_PATTERN=$ELOG_PATTERN"/logs/Event.log"
 echo $ELOG_PATTERN