APP="SSW"
INSTANCE="4";
TARGETPID=`tomcat $APP $INSTANCE check | tail -n 1 | cut -d' ' -f 8`;
echo $TARGETPID;

