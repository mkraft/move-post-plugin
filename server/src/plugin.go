package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"regexp"

	"github.com/mattermost/mattermost-server/model"

	"github.com/mattermost/mattermost-server/plugin"
	"golang.org/x/xerrors"
)

type MovePostPlugin struct {
	plugin.MattermostPlugin
}

type PermissionDeniedError struct {
	Permission *model.Permission
	ChannelID  string
	frame      xerrors.Frame
}

func (e PermissionDeniedError) Error() string {
	return fmt.Sprintf("permission denied error permission_id=%s channel_id=%s", e.Permission.Id, e.ChannelID)
}

func (e PermissionDeniedError) Format(f fmt.State, c rune) {
	xerrors.FormatError(e, f, c)
}

func (e PermissionDeniedError) FormatError(p xerrors.Printer) error {
	p.Print(e.Error())
	if p.Detail() {
		e.frame.Format(p)
	}
	return nil
}

type MovePayload struct {
	ThreadID string `json:"thread_id"`
}

func (p *MovePostPlugin) ServeHTTP(c *plugin.Context, w http.ResponseWriter, r *http.Request) {
	regex := regexp.MustCompile(`/api/v1/posts/[a-z,0-9]{26}/move`)
	if !regex.Match([]byte(r.URL.Path)) || !(r.Method == http.MethodPost) {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	header := r.Header["Mattermost-User-Id"]
	if len(header) == 0 {
		p.API.LogWarn("request missing required header 'Mattermost-User-Id'")
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	currentUserID := header[0]
	postID := r.URL.Path[14:40]

	decoder := json.NewDecoder(r.Body)
	var payload MovePayload
	err := decoder.Decode(&payload)
	if err != nil {
		p.API.LogError(fmt.Sprintf("error decoding JSON: %s", err.Error()))
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	if len(payload.ThreadID) != 26 {
		p.API.LogError("invalid thread id", "thread_id", payload.ThreadID)
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	err = p.hasMoveAccess(currentUserID, postID)
	if err != nil {
		p.API.LogError(fmt.Sprintf("%+v", err), "user_id", currentUserID, "post_id", postID)
		w.WriteHeader(http.StatusBadRequest)
		return
	}

}

func (p *MovePostPlugin) hasMoveAccess(userID, postID string) error {
	if userID == postID {
		return nil
	}

	post, err := p.API.GetPost(postID)
	if err != nil {
		return xerrors.Errorf("error retrieving post: %s", err.Error())
	}

	// user, err := p.API.GetUser(userID)
	// if err != nil {
	// 	return xerrors.Errorf("error retrieving user: %s", err.Error())
	// }

	requiredChannelPerms := []*model.Permission{model.PERMISSION_EDIT_OTHERS_POSTS, model.PERMISSION_DELETE_OTHERS_POSTS}

	for _, perm := range requiredChannelPerms {
		if !p.API.HasPermissionToChannel(userID, post.ChannelId, perm) {
			return PermissionDeniedError{Permission: perm, ChannelID: post.ChannelId, frame: xerrors.Caller(1)}
		}
	}

	return nil
}

func main() {
	plugin.ClientMain(&MovePostPlugin{})
}
