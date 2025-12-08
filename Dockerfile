from ubuntu:24.04

# Setup apt-get
RUN apt-get update

# setup Conda
RUN apt-get install wget -y

RUN mkdir -p ~/miniconda3
RUN wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh -O ~/miniconda3/miniconda.sh
RUN bash ~/miniconda3/miniconda.sh -b -u -p ~/miniconda3
RUN rm ~/miniconda3/miniconda.sh

# Setup aligner environment
RUN apt-get install bash
SHELL ["/bin/bash", "-c"]
RUN . ~/miniconda3/bin/activate; conda init --all
RUN . ~/miniconda3/bin/activate; \
    conda tos accept --override-channels --channel https://repo.anaconda.com/pkgs/main; \
    conda tos accept --override-channels --channel https://repo.anaconda.com/pkgs/r;
RUN . ~/miniconda3/bin/activate; \
    conda create --name aligner -c conda-forge montreal-forced-aligner;
RUN echo "conda activate aligner" >> ~/.bashrc

RUN . ~/miniconda3/bin/activate; \
    conda activate aligner; \
    conda install legacy-cgi; \
    conda install conda-forge::maxminddb;

# setup dirs Files
RUN mkdir ~/gvv
RUN mkdir /rec
run mkdir /var/log/test.acousticgender.space/

# Copy files
COPY align.sh cmudict.txt offline.html serve.py stats.json backend.cgi \
     index.html settings.json sw.js weights.json build.cgi manifest.json \
     textgrid-formants.praat \
     /root/gvv
COPY acousticgender /root/gvv/acousticgender
copy resources /root/gvv/resources
copy ui /root/gvv/ui
