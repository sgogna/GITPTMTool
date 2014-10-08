DIR=$(dirname $(readlink -f $0))
TEST_ID=$1;
PROPERTY=$2;
VALUE=$3;
SERVER=`uname -n`
PTM_ENV=`$DIR/../config/getProperty.sh tools ptm.env.$SERVER`

echo "PTM_ENV appendTestProperties.sh ::: " $PTM_ENV;

if [ "$TEST_ID" != "" ] ; then
  TEST_DIR="$DIR/../artifacts/$PTM_ENV/tests/$TEST_ID"
  if [ ! -d "$TEST_DIR" ]
  then
    echo "Unable to append $PROPERTY=$VALUE, TEST_ID=$TEST_ID does not exsit";
  else
    echo "$PROPERTY=$VALUE" >> "$TEST_DIR/config.properties"
  fi
else
  echo "Unable to append "$PROPERTY"="$VALUE", TEST_ID not set";
fi