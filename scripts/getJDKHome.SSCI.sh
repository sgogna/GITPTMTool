#!/bin/bash
DIR=$(dirname $0)
TARGET=$1
JDK_HOME=`$DIR/../config/getProperty.sh tools JDK_HOME`
echo $JDK_HOME
