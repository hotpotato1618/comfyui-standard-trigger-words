import json
import os
from .standard_trigger_node_v2 import StandardTriggerWordsLoader, NODE_CLASS_MAPPINGS, NODE_DISPLAY_NAME_MAPPINGS
from .standard_trigger_presets import ALL_CATEGORIES

# Specify web directory for JavaScript files
WEB_DIRECTORY = "./js"

def get_node_data():
    # This is a trick to inject presets into the node definition sent to the frontend
    return {
        "presets": ALL_CATEGORIES
    }

# ComfyUI will use this to register the node
__all__ = ['NODE_CLASS_MAPPINGS', 'NODE_DISPLAY_NAME_MAPPINGS', 'WEB_DIRECTORY']

# Standard Trigger Words Loader - ComfyUI Custom Node
# Interactive button-based trigger word management with clickable tags.
