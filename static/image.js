var openedPopover = undefined;
var cart = [];

var checkoutform;

function renderPopover() {
    // if (openedPopover) $(openedPopover).popover('hide');
    openedPopover = this;
    var id = this.id;
    
    return '<div id="popupcontent_'+id+'"></div>'; 

    var ans = "";

    var image_info = image_data[id];
    if (image_info.bought) {
        ans = "Owner: <span class=\"tile_owner\">" + image_info.owner + "</span>";
    } else {

    }
    console.log(id, 'popup: ', ans);
    return ans;
}

function AddTileCart(id) {
    console.log("add to cart", id);
    cart.push(id);
    document.getElementById(id).classList.add("tile_incart");
    document.getElementById('cart').innerText = "Ваш кошик ("+cart.length+"): " + cart.join(", ");
}
function RemoveTileCart(id) {
    console.log("remove from cart", id);
    var index = cart.indexOf(id);
    if (index !== -1) {
        cart.splice(index, 1);
    }
    document.getElementById(id).classList.remove("tile_incart");
}
function tilePopupClick(id) {
    return function(){
        var image_info = image_data[id];
        if (image_info.status != 'bought') {
            var index = cart.indexOf(id);
            if (index === -1) {
                AddTileCart(id);
            } else {
                RemoveTileCart(id);
            }
            
            var cartelem = document.getElementById('cart');
            if (cart.length > 0) {
                checkoutform.classList.remove('hidden');
                cartelem.innerText = "Ваш кошик ("+cart.length+"): " + cart.join(", ");
            }
            else {
                checkoutform.classList.add('hidden');
                cartelem.innerText = "Ваш кошик порожній";
            }
            document.getElementById('input_ntiles').value = cart.length;
            document.getElementById('input_order_cart').value = JSON.stringify(cart);
            document.getElementById('input_money').value = 20 * cart.length;
        }
        var content = document.getElementById('popupcontent_'+id);
        if (image_data[id].status != 'free') {
            content.innerHTML = "Owner: <span class=\"tile_owner\">" + image_info.owner + "</span>";
        } else {
            var index = cart.indexOf(id);
            if (index === -1) {
                content.innerHTML = "<button id=\"cartbtn_"+id+"\" role=\"button\" class=\"btn btn-success\" onclick=\"tilePopupClick('"+id+"')()\">В кошик</a>";
            } else {
                content.innerHTML = "<button id=\"cartbtn_"+id+"\" role=\"button\" class=\"btn btn-primary\" onclick=\"tilePopupClick('"+id+"')()\">З кошика</a>";
            }
        }
    }
}

$(function () {
    checkoutform = document.getElementById('checkout-form');
    checkoutform.classList.add('hidden');

    console.log("Hello!");
    let tiles = $('.tile');
    tiles.popover({
        html: true,
        content: renderPopover
    }).on('inserted.bs.popover', function(){
        openedPopover = this.id;
        console.log('inserting onclick');
        var id = this.id;
        var content = document.getElementById('popupcontent_'+id);
        if (image_data[id].status != 'free') {
            content.innerHTML = "Owner: <span class=\"tile_owner\">" + image_info.owner + "</span>";
        } else {
            var index = cart.indexOf(id);
            if (index === -1) {
                content.innerHTML = "<button id=\"cartbtn_"+id+"\" role=\"button\" class=\"btn btn-success\" onclick=\"tilePopupClick('"+id+"')()\">В кошик</a>";
            } else {
                content.innerHTML = "<button id=\"cartbtn_"+id+"\" role=\"button\" class=\"btn btn-primary\" onclick=\"tilePopupClick('"+id+"')()\">З кошика</a>";
            }
        }
        content.parentNode.parentNode.addEventListener('mouseleave', function() {
            console.log('mouseleave');
            $(this).popover('hide');
        });
        // try {
        //     $('#cartbtn_'+this.id).click(tilePopupClick(this.id)); 
        //     console.log('inserting done. this:',this);
        // } catch(e) { console.log(e) };
    });
    
    for (var i in image_data) {
        if (image_data[i].bought) {
            document.getElementById(i).style.borderRadius = '50%';
        }
    }
})