#!/bin/bash

set -e

clear

if [ "$ETH_truffleNetwork" == "" ]; then
  export ETH_truffleNetwork="development"
fi
echo "** Using truffle network $ETH_truffleNetwork"

if [ "$ETH_truffleSkipMigrate" != "skip" ]; then
  if [ "$ETH_truffleNetwork" == "development" ]; then
    echo "** Killing old ganache"
    scripts/linux/kill.sh ganache-cli

    # Mnemonic is mandatory for testing with Scala; we may as well use it too.
    echo "** Starting new ganache"
    gnome-terminal -- ganache-cli -l 8000000 -m "provide indoor friend weasel side early tumble assist wrong afraid notice earth plug mad tip"
  fi

  rm -rf build

  echo "** Compiling"
  truffle compile

  if [ "$1" != "test" ]; then
    echo "** Migrating"
    truffle --network $ETH_truffleNetwork migrate --reset
  fi
fi

if [ "$1" == "test" ]; then
  truffle --network $ETH_truffleNetwork test $2
  exit 0
fi