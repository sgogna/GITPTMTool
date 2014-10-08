 #!/bin/bash
 DIR=$(dirname $(readlink -f $0))
 TARGET=$1
 ELOG_NAME=$2
 ELOG_PATTERN=`$DIR/../config/getProperty.sh $TARGET $ELOG_NAME`
 echo $ELOG_PATTERN