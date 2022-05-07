let openedPopover = undefined;

function renderPopover() {
    // if (openedPopover) $(openedPopover).popover('hide');
    openedPopover = this;
    console.log("render");
    return "Yeeeah!";
}

let quotes = [
    "Мистецтво, від якого у русні відвалюється дупа",
    "\"Придбав пару сотень пікселів та почуваю себе як ніколи спокійно за майбутнє!\" &#8211 щасливий клієнт Piece of Pixel",
    "\"Єдиний нормальний NFT\" &#8211 один наш поважний знайомий",
    "Мистецтво, що наближує перемогу",
    "Мистецтво, що наближує перемогу",
    "\"А шо це тут у вас за незрозумілі транзакції?\" &#8211 податковий інспектор через пару років",
    "Кожен піксель - патрон у інформаційній війні!",
    "Кожен піксель освячено шляхом підключення серверу до інтернету через тазик зі святою водою",
    "Ви ще не бачили?? Відео з повітряною тривогою в москві! https://www.youtube.com/watch?v=G510jeWiaV0",
]

$(function () {
    console.log("Hello!");
    let tiles = $('.tile');
    tiles.popover({
        content: renderPopover
    });
    
})