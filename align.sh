#!/usr/bin/env bash

source /opt/conda/etc/profile.d/conda.sh
conda activate aligner

mfa align ./corpus/ english english ./output/ --clean

