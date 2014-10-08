DIR=$(dirname $(readlink -f $0))
TEST_ID=$1;
PROPERTY=$2;
SERVER=`uname -n`

PTM_ENV=`$DIR/../config/getProperty.sh tools ptm.env.$SERVER`

if [ "$TEST_ID" != "" ] ; then
if [ "$PTM_ENV" != "" ]
then
  TEST_DIR="$DIR/../artifacts/$PTM_ENV/tests/$TEST_ID"
else
  TEST_DIR="$DIR/../artifacts/tests/$TEST_ID"
fi
  if [ ! -d "$TEST_DIR" ]
  then
    echo "Unable to read $PROPERTY, TEST_ID=$TEST_ID does not exsit";
  else
    value=`grep $PROPERTY $TEST_DIR/config.properties | cut -d'=' -f2`;
    echo "$value"
  fi
else
  echo "Unable to get $PROPERTY, TEST_ID not set";
fi
