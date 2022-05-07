let openedPopover = undefined;

function renderPopover() {
    // if (openedPopover) $(openedPopover).popover('hide');
    openedPopover = this;
    console.log("render");
    return "Yeeeah!";
}


$(function () {
    console.log("Hello!");
    let tiles = $('.tile');
    tiles.popover({
        content: renderPopover
    });
})