function adjustThreeJsContainer() {
    if (window.innerWidth > 820) {
        const threejsContainer = document.querySelector('#threejs-container');
        const image3D = document.querySelector('.image-3d');

        if (threejsContainer) {
            const leftTitle = document.querySelector('.content__left--title');

            if (leftTitle) {
                const rect = leftTitle.getBoundingClientRect();
                const scrollTop = window.scrollY || document.documentElement.scrollTop;

                threejsContainer.style.top = `${rect.top + scrollTop}px`;

                const leftPrice = document.querySelector('.content__left-price-des');

                if (leftPrice) {
                    const rectLeftPrice = leftPrice.getBoundingClientRect();
                    threejsContainer.style.height = `${rectLeftPrice.bottom + scrollTop - (rect.top + scrollTop)}px`;
                }
            } else {
                const leftList = document.querySelector('.content__left-list');

                if (leftList) {
                    const rect = leftList.getBoundingClientRect();
                    const parentRect = leftList.parentElement.getBoundingClientRect();
                    const scrollTop = window.scrollY || document.documentElement.scrollTop;

                    // Tính toán vị trí top relative so với document
                    const topOffset = rect.top + scrollTop - (parentRect.top + scrollTop);

                    threejsContainer.style.top = `${rect.top + scrollTop}px`;
                    threejsContainer.style.height = `${rect.height}px`;
                }
            }

            let bb = threejsContainer.getBoundingClientRect();
            // console.log('L',bb.x , bb.width);
            image3D.style.right = `${document.documentElement.clientWidth - bb.x - bb.width + 20}px`;
            image3D.style.top = (parseFloat(threejsContainer.style.top.replace('px','')) + 20) + 'px';

        }
    }
}
  
window.addEventListener('resize', adjustThreeJsContainer);
window.addEventListener('DOMContentLoaded', adjustThreeJsContainer);
  