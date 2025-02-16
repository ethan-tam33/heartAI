FROM vespaengine/vespa

# Copy Vespa application package into container
COPY . /app/

# Wait for services to start, deploy application, then keep container running
CMD vespa status --wait 300 && \
    cd /app && \
    vespa deploy --wait 300 && \
    tail -f /dev/null
